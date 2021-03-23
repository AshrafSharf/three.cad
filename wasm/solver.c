/*-----------------------------------------------------------------------------
 * Some sample code for slvs.dll. We draw some geometric entities, provide
 * initial guesses for their positions, and then constrain them. The solver
 * calculates their new positions, in order to satisfy the constraints.
 *
 * Copyright 2008-2013 Jonathan Westhues.
 *---------------------------------------------------------------------------*/
#ifdef WIN32
#include <windows.h>
#endif
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#include "slvs.h"

static Slvs_System sys;

static void *CheckMalloc(size_t n)
{
  void *r = malloc(n);
  if (!r)
  {
    printf("out of memory!\n");
    exit(-1);
  }
  return r;
}

/*-----------------------------------------------------------------------------
 * An example of a constraint in 3d. We create a single group, with some
 * entities and constraints.
 *---------------------------------------------------------------------------*/

int solver(int nLines, float *ptr)
{

  float *buf_pt_start = ptr;

  Slvs_hGroup g;
  double qw, qx, qy, qz;

  g = 1;
  /* First, we create our workplane. Its origin corresponds to the origin
     * of our base frame (x y z) = (0 0 0) */
  sys.param[sys.params++] = Slvs_MakeParam(1, g, 0.0);
  sys.param[sys.params++] = Slvs_MakeParam(2, g, 0.0);
  sys.param[sys.params++] = Slvs_MakeParam(3, g, 0.0);
  sys.entity[sys.entities++] = Slvs_MakePoint3d(101, g, 1, 2, 3);
  /* and it is parallel to the xy plane, so it has basis vectors (1 0 0)
     * and (0 1 0).  */
  Slvs_MakeQuaternion(1, 0, 0,
                      0, 1, 0, &qw, &qx, &qy, &qz);
  sys.param[sys.params++] = Slvs_MakeParam(4, g, qw);
  sys.param[sys.params++] = Slvs_MakeParam(5, g, qx);
  sys.param[sys.params++] = Slvs_MakeParam(6, g, qy);
  sys.param[sys.params++] = Slvs_MakeParam(7, g, qz);
  sys.entity[sys.entities++] = Slvs_MakeNormal3d(102, g, 4, 5, 6, 7);

  sys.entity[sys.entities++] = Slvs_MakeWorkplane(200, g, 101, 102);

  /* Now create a second group. We'll solve group 2, while leaving group 1
     * constant; so the workplane that we've created will be locked down,
     * and the solver can't move it. */
  g = 2;
  /* These points are represented by their coordinates (u v) within the
     * workplane, so they need only two parameters each. */

  int p_start = sys.params;

  Slvs_hParam ph = 11, ph_s = 11;
  Slvs_hParam vh = 301, vh_s = 301;
  Slvs_hParam lh = 400, lh_s = 400;

  Slvs_hParam con_id = 1;

  for (int i = 0; i < nLines * 2; i++)
  {

    sys.param[sys.params++] = Slvs_MakeParam(ph++, g, (float)*ptr++);
    sys.param[sys.params++] = Slvs_MakeParam(ph++, g, (float)*ptr++);
    sys.entity[sys.entities++] = Slvs_MakePoint2d(vh++, g, 200, ph - 1, ph - 2);

    if (i % 2 == 1)
    {
      sys.entity[sys.entities++] = Slvs_MakeLineSegment(lh++, g,
                                                        200, vh - 1, vh - 2);
    }
    else if (i > 0)
    {
      sys.constraint[sys.constraints++] = Slvs_MakeConstraint(
          con_id++, g,
          SLVS_C_POINTS_COINCIDENT,
          200,
          0.0,
          vh - 2, vh - 1, 0, 0);
    }
  }

  /* And solve. */
  Slvs_Solve(&sys, g);

  if (sys.result == SLVS_RESULT_OKAY)
  {
    // printf("solved okay\n");

    for (int i = 0; i < nLines * 4; i++)
    {
      *buf_pt_start++ = (float)sys.param[p_start++].val;
    }
  }
  else
  {
    int i;
    printf("solve failed: problematic constraints are:");
    for (i = 0; i < sys.faileds; i++)
    {
      printf(" %d", sys.failed[i]);
    }
    printf("\n");
    if (sys.result == SLVS_RESULT_INCONSISTENT)
    {
      printf("system inconsistent\n");
    }
    else
    {
      printf("system nonconvergent\n");
    }
  }
  sys.params = sys.constraints = sys.entities = 0;
  return 0;
}

int main(int argc, char *argv[])
{
  sys.param = CheckMalloc(50 * sizeof(sys.param[0]));
  sys.entity = CheckMalloc(50 * sizeof(sys.entity[0]));
  sys.constraint = CheckMalloc(50 * sizeof(sys.constraint[0]));

  sys.failed = CheckMalloc(50 * sizeof(sys.failed[0]));
  sys.faileds = 50;

  // Example2d(150.0);

  printf("hello\n");
  return 0;
}
